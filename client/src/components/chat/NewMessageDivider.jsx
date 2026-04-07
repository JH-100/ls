import { forwardRef } from 'react';

const NewMessageDivider = forwardRef((props, ref) => {
  return (
    <div className="new-msg-divider" id="newMsgDivider" ref={ref}>
      여기서부터 새 메시지
    </div>
  );
});

NewMessageDivider.displayName = 'NewMessageDivider';

export default NewMessageDivider;
