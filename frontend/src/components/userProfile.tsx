import { useProfile } from '../hooks/useProfile';
import { FaUser } from 'react-icons/fa';

export function UserProfile() {
  const { profile } = useProfile();

  return (
    <div className="ProfileHeader">
      {profile?.avatarUrl ? (
        <img src={profile.avatarUrl} alt="Avatar" className="avatar" />
      ) : (
        <div className="avatar-placeholder">
          <FaUser />
        </div>
      )}
      <h2>{profile?.name}</h2>
      {profile?.username && <span className="settings-handle">@{profile.username}</span>}
    </div>
  );
}
