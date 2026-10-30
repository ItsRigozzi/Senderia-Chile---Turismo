import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLinkProps {
  subtitle?: string;
}

const BrandLink: React.FC<BrandLinkProps> = ({ subtitle }) => (
  <Link to="/explorar" className="brand-link" aria-label="Sendería Chile: explorar destinos">
    <span className="brand-badge" aria-hidden="true">▲</span>
    <span className="brand-link-copy">
      <span className="brand-link-title">Senderia <span>Chile</span></span>
      {subtitle && <span className="brand-link-subtitle">{subtitle}</span>}
    </span>
  </Link>
);

export default BrandLink;
