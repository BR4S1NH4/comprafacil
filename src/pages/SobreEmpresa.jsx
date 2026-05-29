import React from 'react'
import { PageHeader } from '../components/Layout'
import CompanyAboutPanel from '../components/CompanyAboutPanel'
import { mergeAboutPage } from '../utils/aboutPageSettings'

export default function SobreEmpresa({ empresa, vitrineAmazon }) {
  const nomeLoja = empresa?.nomeLoja?.trim() || 'Castor Construtor'
  const about = mergeAboutPage(empresa?.paginaSobre)

  return (
    <>
      {!vitrineAmazon && (
        <PageHeader
          title={about.titulo}
          sub={about.subtitulo}
          breadcrumbs={['Loja', about.titulo]}
        />
      )}
      {vitrineAmazon && (
        <div className="cf-page-header" style={{ paddingBottom: 12 }}>
          <h1 className="cf-page-title" style={{ fontSize: 20 }}>
            {about.titulo}
            {about.subtitulo && (
              <small style={{ display: 'block', marginTop: 4 }}>{about.subtitulo}</small>
            )}
          </h1>
        </div>
      )}
      <div className="cf-page-body">
        <CompanyAboutPanel
          nomeLoja={nomeLoja}
          about={about}
          logoEmpresa={empresa?.logoDataUrl}
          pageMode
        />
      </div>
    </>
  )
}
