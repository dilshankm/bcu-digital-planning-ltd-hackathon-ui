declare module 'govuk-frontend' {
  interface InitAllOptions {
    scope?: Element | Document
  }

  export function initAll(options?: InitAllOptions): void
}

