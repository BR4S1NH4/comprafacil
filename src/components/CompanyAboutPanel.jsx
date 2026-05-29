import React from 'react'
import { Leaf, Home, Users, Building2, Hammer, Heart } from 'lucide-react'
import { applyAboutPlaceholders, mergeAboutPage } from '../utils/aboutPageSettings'
import { isUsableImageSrc, resolveLogoUrls } from '../branding'

const ICON_MAP = {
  home: Home,
  leaf: Leaf,
  users: Users,
  building: Building2,
  hammer: Hammer,
  heart: Heart,
}

export default function CompanyAboutPanel({
  nomeLoja,
  about: aboutProp,
  logoEmpresa,
  pageMode = false,
  omitHeading = false,
}) {
  const nome = (nomeLoja || 'Castor Construtor').trim()
  const about = mergeAboutPage(aboutProp)
  const decor = about.decoracao
  const { header: defaultLogo } = resolveLogoUrls({ logoDataUrl: logoEmpresa })

  const decorLogo = isUsableImageSrc(decor.logoDecorDataUrl) ? decor.logoDecorDataUrl.trim() : null
  const empresaLogo = isUsableImageSrc(logoEmpresa) ? logoEmpresa.trim() : null
  const heroLogo =
    decorLogo ||
    (decor.usarLogoEmpresa && empresaLogo ? empresaLogo : null) ||
    defaultLogo

  const opacidade = decor.opacidadeArtes ?? 0.18

  return (
    <article className={`cf-about-page${pageMode ? ' cf-about-page--full' : ''}`}>
      {pageMode && (
        <>
          {isUsableImageSrc(decor.arteEsquerdaDataUrl) && (
            <img
              className="cf-about-deco cf-about-deco--left"
              src={decor.arteEsquerdaDataUrl.trim()}
              alt=""
              aria-hidden
              style={{ opacity: opacidade }}
            />
          )}
          {isUsableImageSrc(decor.arteDireitaDataUrl) && (
            <img
              className="cf-about-deco cf-about-deco--right"
              src={decor.arteDireitaDataUrl.trim()}
              alt=""
              aria-hidden
              style={{ opacity: opacidade }}
            />
          )}
        </>
      )}

      <div className="cf-about-page-inner">
        {pageMode && heroLogo && (
          <div className="cf-about-hero">
            <img className="cf-about-hero-logo" src={heroLogo} alt={nome} decoding="async" />
          </div>
        )}

        {!omitHeading && (
          <header className="cf-about-header">
            <h2 className="cf-about-title">{about.titulo}</h2>
            {about.subtitulo && <p className="cf-about-subtitle">{about.subtitulo}</p>}
          </header>
        )}

        <p className="cf-about-lead">{applyAboutPlaceholders(about.lead, nome)}</p>

        {about.blocos.map((bloco) => {
          const Icon = ICON_MAP[bloco.icone] || Building2
          return (
            <div key={bloco.id} className="cf-about-block">
              <h3>
                <Icon size={16} /> {bloco.titulo}
              </h3>
              <p>{applyAboutPlaceholders(bloco.texto, nome)}</p>
            </div>
          )
        })}

        <p className="cf-about-foot text-muted text-sm">
          {applyAboutPlaceholders(about.rodape, nome)}
        </p>
      </div>
    </article>
  )
}
