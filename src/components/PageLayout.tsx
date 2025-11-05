import type { PropsWithChildren, ReactNode } from 'react'

interface PageLayoutProps extends PropsWithChildren {
  title: string
  description?: ReactNode
}

export const PageLayout = ({ title, description, children }: PageLayoutProps) => (
  <div className="app-shell">
    <header className="govuk-header" role="banner" data-module="govuk-header">
      <div className="govuk-header__container govuk-width-container">
        <div className="govuk-header__logo">
          <a
            className="govuk-header__link govuk-header__link--homepage"
            href="https://wmhtia.com/"
            rel="noreferrer"
            target="_blank"
          >
            <span className="govuk-header__logotype-text">WMHTIA</span>
          </a>
        </div>
        <div className="govuk-header__content">
          <span className="govuk-header__service-name">Healthcare Assistant</span>
        </div>
      </div>
    </header>

    <main className="app-shell__main" id="main-content" role="main">
      <div className="govuk-width-container">
        <div className="govuk-main-wrapper govuk-main-wrapper--auto-spacing">
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-two-thirds">
              <span className="govuk-caption-l">
                BCU Hackathon Challenge - Synthea Healthcare Dataset
              </span>
              <h1 className="govuk-heading-l govuk-!-margin-bottom-3">{title}</h1>
              {description && (
                <p className="govuk-body govuk-!-margin-bottom-6">{description}</p>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer className="govuk-footer app-shell__footer" role="contentinfo">
      <div className="govuk-width-container">
        <div className="govuk-footer__meta">
          <div className="govuk-footer__meta-item govuk-footer__meta-item--grow">
            <h2 className="govuk-visually-hidden">Support links</h2>
            <span className="govuk-footer__licence-description">
              Healthcare Assistant powered by intelligent graph technology. Built for BCU Hackathon using synthetic patient data.
            </span>
          </div>
          <div className="govuk-footer__meta-item">
            <a
              className="govuk-footer__link"
              href="https://design-system.service.gov.uk/"
              rel="noreferrer"
              target="_blank"
            >
              Learn about the design system
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
)

export default PageLayout

