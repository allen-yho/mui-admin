export interface MenuMeta {
  icon?: string
  title?: string
  i18n?: string
  isHide?: boolean
  isFull?: boolean
  isAffix?: boolean
  isKeepAlive?: boolean
  permissions?: string[]
}

export interface Menu {
  id: string
  parentId: string
  name?: string
  path?: string
  redirect?: string
  state: boolean
  menuSort: number
  meta?: MenuMeta
  children?: Menu[]
}
