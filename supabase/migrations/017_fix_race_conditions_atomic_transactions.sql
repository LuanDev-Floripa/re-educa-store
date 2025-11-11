-- ============================================================
-- Migração 017: Correção de Race Conditions e Transações Atômicas
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025-01-27
-- ============================================================
--
-- Esta migração corrige:
-- 1. Race conditions em operações de estoque
-- 2. Falta de transações atômicas em create_order
--
-- ============================================================

-- ============================================================
-- 1. ADICIONAR CHECK CONSTRAINT PARA ESTOQUE
-- ============================================================

-- Garantir que estoque nunca fica negativo
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS check_stock_positive;

ALTER TABLE products 
ADD CONSTRAINT check_stock_positive 
CHECK (stock_quantity >= 0);

-- ============================================================
-- 2. FUNÇÃO PARA ATUALIZAÇÃO ATÔMICA DE ESTOQUE
-- ============================================================

CREATE OR REPLACE FUNCTION update_product_stock(
    p_product_id UUID,
    p_quantity_change INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
    v_product_name TEXT;
BEGIN
    -- Lock pessimista: SELECT FOR UPDATE bloqueia a linha até o fim da transação
    SELECT stock_quantity, name 
    INTO v_current_stock, v_product_name
    FROM products 
    WHERE id = p_product_id 
    FOR UPDATE;  -- Lock pessimista
    
    -- Se produto não existe, retornar erro
    IF v_current_stock IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Produto não encontrado'
        );
    END IF;
    
    -- Calcular novo estoque
    v_new_stock := v_current_stock + p_quantity_change;
    
    -- Verificar se não fica negativo (CHECK constraint também protege)
    IF v_new_stock < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Estoque insuficiente',
            'current_stock', v_current_stock,
            'requested_change', p_quantity_change
        );
    END IF;
    
    -- Atualizar estoque
    UPDATE products 
    SET 
        stock_quantity = v_new_stock,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Retornar sucesso
    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'product_name', v_product_name,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'quantity_change', p_quantity_change
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar mensagem
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. FUNÇÃO PARA CRIAÇÃO ATÔMICA DE PEDIDOS
-- ============================================================

CREATE OR REPLACE FUNCTION create_order_atomic(
    p_user_id UUID,
    p_order_data JSONB,
    p_cart_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_total DECIMAL(10,2) := 0;
    v_subtotal DECIMAL(10,2) := 0;
    v_item_total DECIMAL(10,2);
    v_product_id UUID;
    v_quantity INTEGER;
    v_price DECIMAL(10,2);
    v_stock_result JSONB;
    v_created_order JSONB;
    v_order_data_obj JSONB;
    v_cart_items_arr JSONB;
BEGIN
    -- Iniciar transação (implícito em função)
    
    -- Converter p_order_data se for string JSON
    IF jsonb_typeof(p_order_data) = 'string' THEN
        v_order_data_obj := p_order_data::jsonb;
    ELSE
        v_order_data_obj := p_order_data;
    END IF;
    
    -- Converter p_cart_items se for string JSON
    IF jsonb_typeof(p_cart_items) = 'string' THEN
        v_cart_items_arr := p_cart_items::jsonb;
    ELSE
        v_cart_items_arr := p_cart_items;
    END IF;
    
    -- Validar que tem itens no carrinho
    IF v_cart_items_arr IS NULL OR jsonb_typeof(v_cart_items_arr) != 'array' OR jsonb_array_length(v_cart_items_arr) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Carrinho vazio'
        );
    END IF;
    
    -- Validar estoque e calcular total
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_cart_items_arr)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        v_price := COALESCE((v_item->>'price')::DECIMAL, 0);
        
        -- Validar estoque antes de criar pedido
        v_stock_result := update_product_stock(v_product_id, -v_quantity);
        
        IF NOT (v_stock_result->>'success')::BOOLEAN THEN
            -- Rollback automático (função falha)
            RAISE EXCEPTION 'Estoque insuficiente para produto %: %', 
                v_product_id, 
                v_stock_result->>'error';
        END IF;
        
        v_item_total := v_price * v_quantity;
        v_subtotal := v_subtotal + v_item_total;
    END LOOP;
    
    -- Calcular total (subtotal - desconto + frete)
    v_total := COALESCE((v_order_data_obj->>'total')::DECIMAL, v_subtotal);
    
    -- Gerar ID do pedido
    v_order_id := gen_random_uuid();
    
    -- 1. Criar pedido
    -- NOTA: As colunas discount_amount, shipping_cost são adicionadas em 003_store_system.sql
    -- Como 017 executa após 003, essas colunas devem existir.
    INSERT INTO orders (
        id,
        user_id,
        total,
        discount_amount,
        shipping_cost,
        status,
        payment_status,
        shipping_address,
        payment_method,
        coupon_code,
        transaction_id,
        created_at,
        updated_at
    ) VALUES (
        v_order_id,
        p_user_id,
        v_total,
        COALESCE((v_order_data_obj->>'discount_amount')::DECIMAL, 0),
        COALESCE((v_order_data_obj->>'shipping_cost')::DECIMAL, 0),
        COALESCE(v_order_data_obj->>'status', 'pending'),
        COALESCE(v_order_data_obj->>'payment_status', 'pending'),
        v_order_data_obj->'shipping_address',
        v_order_data_obj->>'payment_method',
        v_order_data_obj->>'coupon_code',
        v_order_data_obj->>'transaction_id',
        NOW(),
        NOW()
    );
    
    -- 2. Criar itens do pedido
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_cart_items_arr)
    LOOP
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            price,
            created_at
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            COALESCE((v_item->>'price')::DECIMAL, 0),
            NOW()
        );
    END LOOP;
    
    -- 3. Limpar carrinho (dentro da mesma transação)
    DELETE FROM cart_items 
    WHERE user_id = p_user_id;
    
    -- 4. Buscar pedido completo criado
    -- NOTA: As colunas discount_amount, shipping_cost, payment_status, etc. são adicionadas em 003_store_system.sql
    -- Como 017 executa após 003, essas colunas devem existir. Usar acesso direto.
    SELECT jsonb_build_object(
        'id', o.id,
        'user_id', o.user_id,
        'total', o.total,
        'discount_amount', o.discount_amount,
        'shipping_cost', o.shipping_cost,
        'status', o.status,
        'payment_status', o.payment_status,
        'shipping_address', o.shipping_address,
        'payment_method', o.payment_method,
        'coupon_code', o.coupon_code,
        'transaction_id', o.transaction_id,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'items', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'price', oi.price
                )
            ) FROM order_items oi WHERE oi.order_id = o.id),
            '[]'::jsonb
        )
    ) INTO v_created_order
    FROM orders o
    WHERE o.id = v_order_id;
    
    -- Retornar sucesso
    RETURN jsonb_build_object(
        'success', true,
        'order', v_created_order,
        'message', 'Pedido criado com sucesso'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback automático em caso de erro
        -- Estoque é revertido automaticamente se a transação falhar
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. COMENTÁRIOS
-- ============================================================

COMMENT ON FUNCTION update_product_stock(UUID, INTEGER) IS 
'Atualiza estoque de produto de forma atômica com lock pessimista. 
Retorna JSONB com success e dados ou erro.';

COMMENT ON FUNCTION create_order_atomic(UUID, JSONB, JSONB) IS 
'Cria pedido de forma atômica: valida estoque, cria pedido, cria itens e limpa carrinho em uma única transação. 
Rollback automático em caso de erro.';

COMMENT ON CONSTRAINT check_stock_positive ON products IS 
'Garante que estoque nunca fica negativo. 
Proteção adicional além da validação na função.';

-- ============================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Índice para lock de estoque (já deve existir, mas garantir)
CREATE INDEX IF NOT EXISTS idx_products_id_for_update ON products(id) WHERE stock_quantity > 0;

-- ============================================================
-- 6. VALIDAÇÃO
-- ============================================================

-- Testar que constraint funciona
DO $$
BEGIN
    -- Tentar inserir produto com estoque negativo (deve falhar)
    BEGIN
        INSERT INTO products (name, price, stock_quantity) 
        VALUES ('Teste', 10.00, -1);
        RAISE EXCEPTION 'CHECK constraint não está funcionando!';
    EXCEPTION
        WHEN check_violation THEN
            -- OK, constraint funciona
            NULL;
    END;
END $$;

SELECT 'Migração 017: Correção de race conditions e transações atômicas aplicada com sucesso!' as status;