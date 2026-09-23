export interface IProfile {
  _id: string;
  name: string;
  age: number;
  avatarUrl: string | null;
  role: 'client' | 'coach';
}
