/**
 * Footer Component - RE-EDUCA Store
 * 
 * Rodapé do site com links e informações.
 * 
 * Funcionalidades:
 * - Links de navegação organizados por categoria
 * - Links de redes sociais
 * - Informações de copyright
 * - Links legais (Privacidade, Termos, LGPD)
 * 
 * @component
 * @returns {JSX.Element} Rodapé completo do site
 */
import React from "react";
import { Link } from "react-router-dom";
import { Heart, Github, Twitter, Instagram, Mail } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Ferramentas", href: "/tools" },
      { name: "Loja", href: "/store" },
      { name: "Preços", href: "/pricing" },
      { name: "API", href: "/api" },
    ],
    company: [
      { name: "Sobre", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Carreiras", href: "/careers" },
      { name: "Contato", href: "/contact" },
    ],
    support: [
      { name: "Central de Ajuda", href: "/help" },
      { name: "Documentação", href: "/docs" },
      { name: "Status", href: "/status" },
      { name: "Comunidade", href: "/community" },
    ],
    legal: [
      { name: "Privacidade", href: "/privacy" },
      { name: "Termos", href: "/terms" },
      { name: "Cookies", href: "/cookies" },
      { name: "LGPD", href: "/lgpd" },
    ],
  };

  const socialLinks = [
    { name: "GitHub", href: "https://github.com", icon: Github },
    { name: "Twitter", href: "https://twitter.com", icon: Twitter },
    { name: "Instagram", href: "https://instagram.com", icon: Instagram },
    { name: "Email", href: "mailto:contato@re-educa.com", icon: Mail },
  ];

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Heart className="h-8 w-8 text-red-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                RE-EDUCA
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              Transformando vidas através da educação em saúde. Ferramentas
              inovadoras para uma vida mais saudável.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Produto
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Empresa
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Suporte
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {currentYear} RE-EDUCA Store. Todos os direitos reservados.
            </p>
            <div className="mt-4 md:mt-0 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <span>Feito com</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>no Brasil</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
