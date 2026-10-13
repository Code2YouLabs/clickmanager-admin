export type SiteHomeSectionTipo =
  | 'PRODUTOS'
  | 'CATEGORIAS'
  | 'MARCAS'
  | 'QUEM_SOMOS'
  | 'LOCALIZACAO'
  | 'CTA';

export type SiteHomeSectionLayout =
  | 'GRID'
  | 'LISTA'
  | 'CARROSSEL'
  | 'DESTAQUE';

export interface SiteHomeSection {
  id: number;
  tipo: SiteHomeSectionTipo;
  titulo: string;
  subtitulo?: string | null;
  ativo: boolean;
  ordem: number;
  limiteItens?: number | null;
  layout: SiteHomeSectionLayout;
  configJson?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteHomeSectionRequest {
  tipo: SiteHomeSectionTipo;
  titulo: string;
  subtitulo?: string | null;
  ativo: boolean;
  ordem: number;
  limiteItens?: number | null;
  layout: SiteHomeSectionLayout;
  configJson: unknown;
}

export interface SiteHomeSectionStatusRequest {
  ativo: boolean;
}

export interface SiteHomeSectionOrdemRequest {
  id: number;
  ordem: number;
}

export const SITE_HOME_SECTION_TIPOS: Array<{ id: SiteHomeSectionTipo; nome: string }> = [
  { id: 'PRODUTOS', nome: 'Produtos' },
  { id: 'CATEGORIAS', nome: 'Categorias' },
  { id: 'MARCAS', nome: 'Marcas' },
  { id: 'QUEM_SOMOS', nome: 'Quem somos' },
  { id: 'LOCALIZACAO', nome: 'Localização' },
  { id: 'CTA', nome: 'CTA' }
];

export const SITE_HOME_SECTION_LAYOUTS: Array<{ id: SiteHomeSectionLayout; nome: string }> = [
  { id: 'GRID', nome: 'Grid' },
  { id: 'LISTA', nome: 'Lista' },
  { id: 'CARROSSEL', nome: 'Carrossel' },
  { id: 'DESTAQUE', nome: 'Destaque' }
];

export const SITE_HOME_SECTION_TIPOS_SEM_ITENS: SiteHomeSectionTipo[] = [
  'QUEM_SOMOS',
  'LOCALIZACAO',
  'CTA'
];
