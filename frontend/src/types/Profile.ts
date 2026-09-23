export interface IProfile {
  _id: string;
  /** Lowercase handle without the '@'; null until the user picks one. */
  username: string | null;
  name: string;
  age: number;
  avatarUrl: string | null;
  bio: string;
  coachTags: string[];
  isAdmin: boolean;
}
