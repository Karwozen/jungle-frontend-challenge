import { Fragment } from 'react'
import { Link } from '@tanstack/react-router'

function Breadcrumb({ current }: { current?: string }) {
  return (
    <nav aria-label="Trilha" className="mb-4 hidden text-sm font-bold md:block">
      <Link to="/">Início</Link> /{' '}
      {current ? (
        <Fragment>
          <Link to="/" hash="catalogo">
            Mercado
          </Link>{' '}
          / <span aria-current="page">{current}</span>
        </Fragment>
      ) : (
        <Link to="/" hash="catalogo">
          Mercado
        </Link>
      )}
    </nav>
  )
}

export default Breadcrumb
