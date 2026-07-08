export class ReunionNomination {
  reunionNominationId?: string
  name: string
  description: string
  city: string
  state: string
  url: string
  createdByUUID: string
  bedrooms?: number
  bathrooms?: number
  capacity?: number
  units?: number
  price?: number

  constructor(
    name: string,
    description: string,
    city: string,
    state: string,
    url: string,
    createdByUUID: string,
    bedrooms?: number,
    bathrooms?: number,
    capacity?: number,
    units?: number,
    price?: number,
    reunionNominationId?: string
  ) {
    this.reunionNominationId = reunionNominationId
    this.name = name
    this.description = description
    this.city = city
    this.state = state
    this.url = url
    this.createdByUUID = createdByUUID
    this.bedrooms = bedrooms
    this.bathrooms = bathrooms
    this.capacity = capacity
    this.units = units
    this.price = price
  }
}
