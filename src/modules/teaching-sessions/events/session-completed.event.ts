export class SessionCompletedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly topicId: string,
    public readonly masteryScore: number,
  ) {}
}
