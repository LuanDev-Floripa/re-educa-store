/**
 * Magic UI Components - RE-EDUCA Store
 * 
 * Cole??o de microcomponentes visuais com anima??es e efeitos especiais.
 * 
 * Observa??o: Este arquivo exporta apenas componentes de UI puros.
 * N?o adicionar helpers l?gicos aqui - mover para utils se necess?rio.
 * 
 * @module MagicUI
 */
import React from "react";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { cn } from "@/lib/utils";

// ================================
// MAGIC UI COMPONENTS
// ================================

/**
 * AnimatedGradient - Container com gradiente animado.
 * 
 * Cria um container com gradiente animado de fundo usando cores suaves.
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.children - Conte?do a ser renderizado
 * @param {string} [props.className] - Classes CSS adicionais
 * @returns {JSX.Element} Container com gradiente animado
 */
export const AnimatedGradient = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-purple-50",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-green-400/20 to-purple-400/20 animate-gradient-x"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * FloatingElement - Elemento com anima??o de flutua??o suave.
 * 
 * Aplica uma anima??o de movimento vertical e rota??o sutil ao conte?do.
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.children - Conte?do a ser animado
 * @param {number} [props.delay=0] - Delay inicial da anima??o em segundos
 * @param {string} [props.className] - Classes CSS adicionais
 * @returns {JSX.Element} Elemento com anima??o de flutua??o
 */
export const FloatingElement = ({
  children,
  delay = 0,
  className,
  ...props
}) => {
  return (
    <motion.div
      className={cn("", className)}
      animate={{
        y: [0, -10, 0],
        rotate: [0, 1, -1, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * MagneticButton - Bot?o com efeito magn?tico que segue o cursor do mouse.
 * 
 * O bot?o se move levemente na dire??o do cursor, criando um efeito de atra??o magn?tica.
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.children - Conte?do do bot?o
 * @param {string} [props.className] - Classes CSS adicionais
 * @returns {JSX.Element} Bot?o com efeito magn?tico
 */
export const MagneticButton = ({ children, className, ...props }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.1, y: y * 0.1 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      className={cn(
        "relative overflow-hidden rounded-lg bg-gradient-to-r from-green-500 to-blue-500 px-6 py-3 text-white font-medium shadow-lg transition-all duration-300 hover:shadow-xl",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
    </motion.button>
  );
};

/**
 * MorphingCard - Card com efeito de transforma??o (morph) ao hover.
 * 
 * Aplica escala e rota??o 3D quando o mouse passa sobre o card.
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.children - Conte?do do card
 * @param {string} [props.className] - Classes CSS adicionais
 * @returns {JSX.Element} Card com efeito morph
 */
export const MorphingCard = ({ children, className, ...props }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg",
        className,
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={{
        scale: isHovered ? 1.02 : 1,
        rotateY: isHovered ? 5 : 0,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-blue-400/10 to-purple-400/10"
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

/**
 * ParticleSystem - Sistema de part?culas animadas para background.
 * 
 * Cria m?ltiplas part?culas que flutuam e desaparecem, criando efeito de movimento constante.
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {number} [props.count=50] - N?mero de part?culas a serem criadas
 * @param {string} [props.className] - Classes CSS adicionais
 * @returns {JSX.Element} Sistema de part?culas animadas
 */
export const ParticleSystem = ({ count = 50, className }) => {
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
  }, [count]);

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className,
      )}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-green-400 to-blue-400 opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

/**
 * GlowingBorder - Container com borda brilhante e gradiente.
 * 
 * Cria uma borda animada com efeito de brilho usando gradiente de cores.
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.children - Conte?do a ser envolvido
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {"green"|"blue"|"purple"|"pink"} [props.glowColor="green"] - Cor do brilho
 * @returns {JSX.Element} Container com borda brilhante
 */
export const GlowingBorder = ({
  children,
  className,
  glowColor = "green",
  ...props
}) => {
  const glowColors = {
    green: "shadow-green-500/50",
    blue: "shadow-blue-500/50",
    purple: "shadow-purple-500/50",
    pink: "shadow-pink-500/50",
  };

  return (
    <div
      className={cn(
        "relative rounded-lg p-[1px] bg-gradient-to-r from-green-500 via-blue-500 to-purple-500",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-lg blur-sm",
          glowColors[glowColor],
        )}
      />
      <div className="relative rounded-lg bg-white/95 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
};

/**
 * TypingAnimation - efeito de digita??o para texto.
 */
export const TypingAnimation = ({ text, className, speed = 50 }) => {
  const [displayText, setDisplayText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (typeof text === "string" && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={cn("", className)}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="ml-1"
      >
        |
      </motion.span>
    </span>
  );
};

/**
 * RippleEffect - Efeito de ondas (ripple) ao clicar no elemento.
 * 
 * Cria um efeito de ondas circulares que se expandem a partir do ponto de clique.
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.children - Conte?do que receber? o efeito
 * @param {string} [props.className] - Classes CSS adicionais
 * @returns {JSX.Element} Elemento com efeito ripple
 */
export const RippleEffect = ({ children, className, ...props }) => {
  const [ripples, setRipples] = React.useState([]);

  const createRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);
  };

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onClick={createRipple}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

/**
 * StaggerContainer - container que aplica stagger aos filhos.
 */
export const StaggerContainer = ({
  children,
  className,
  staggerDelay = 0.1,
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * InfiniteScrollText - Texto com rolagem infinita horizontal.
 * 
 * Cria um efeito de texto rolando continuamente da direita para a esquerda.
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {string} props.text - Texto a ser animado
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {number} [props.speed=50] - Dura??o da anima??o em segundos
 * @returns {JSX.Element} Texto com rolagem infinita
 */
export const InfiniteScrollText = ({ text, className, speed = 50 }) => {
  return (
    <div className={cn("overflow-hidden whitespace-nowrap", className)}>
      <motion.div
        className="inline-block"
        animate={{ x: ["100%", "-100%"] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {text}
      </motion.div>
    </div>
  );
};

export default {
  AnimatedGradient,
  FloatingElement,
  MagneticButton,
  MorphingCard,
  ParticleSystem,
  GlowingBorder,
  TypingAnimation,
  RippleEffect,
  StaggerContainer,
  InfiniteScrollText,
};
