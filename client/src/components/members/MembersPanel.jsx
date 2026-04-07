import { useState, useEffect } from 'react';
import { apiCall } from '../../api';
import { XIcon } from '../icons';
import Avatar from '../common/Avatar';
import StatusDot from '../common/StatusDot';

export default function MembersPanel({ channelId, onClose }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await apiCall(`/api/channels/${channelId}/members`);
        setMembers(data);
      } catch {
        setMembers([]);
      }
    };
    if (channelId) {
      fetchMembers();
    }
  }, [channelId]);

  return (
    <div className="members-panel">
      <div className="members-header">
        <h3>멤버</h3>
        <button className="icon-btn" onClick={onClose}>
          <XIcon size={18} />
        </button>
      </div>
      <ul className="members-list">
        {members.map((member) => (
          <li key={member.id}>
            <Avatar
              name={member.display_name}
              color={member.avatar_color}
              size={32}
            />
            <StatusDot status={member.status} />
            <span>{member.display_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
