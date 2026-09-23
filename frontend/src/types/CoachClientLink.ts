export interface ICoachClientLink {
  _id: string;
  clientEmail: string;
  clientId: string | null;
  inviteToken: string;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: string;
  acceptedAt: string | null;
}
