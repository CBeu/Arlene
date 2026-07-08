export class Reunion {
  reunionId?: string
  name: string
  description?: string
  created: Date
  createdByUUID: string
  reunionStartDate?: Date
  reunionEndDate?: Date
  members: string[]
  nominations: string[]

  constructor(
    name: string,
    created: Date,
    createdByUUID: string,
    members: string[] = [],
    nominations: string[] = [],
    description?: string,
    reunionStartDate?: Date,
    reunionEndDate?: Date,
    reunionId?: string
  ) {
    this.reunionId = reunionId
    this.name = name
    this.created = created
    this.createdByUUID = createdByUUID
    this.members = members
    this.nominations = nominations
    this.description = description
    this.reunionStartDate = reunionStartDate
    this.reunionEndDate = reunionEndDate
  }
}
