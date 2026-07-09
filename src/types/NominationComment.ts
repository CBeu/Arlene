export class NominationComment {
  nominationCommentId: string
  nominationId: string
  createdByUUID: string
  createdByName: string
  comment: string
  createdAt: string

  constructor(
    nominationCommentId: string,
    nominationId: string,
    createdByUUID: string,
    createdByName: string,
    comment: string,
    createdAt: string
  ) {
    this.nominationCommentId = nominationCommentId
    this.nominationId = nominationId
    this.createdByUUID = createdByUUID
    this.createdByName = createdByName
    this.comment = comment
    this.createdAt = createdAt
  }
}
