export interface Theme {
  id: string
  displayName: string
  logoPath: string
  heroImagePath: string
  fonts: {
    displayFamily: string
    sansFamily: string
  }
}
