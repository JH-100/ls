// Common emojis for the picker
const EMOJI_LIST = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
  '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
  '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
  '😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔',
  '😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶',
  '🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟',
  '🙁','😮','😯','😲','😳','🥺','😦','😧','😨','😰',
  '😥','😢','😭','😱','😖','😣','😞','😓','😩','😫',
  '🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩',
  '👍','👎','👏','🙌','🤝','🙏','💪','🔥','❤️','💯',
  '⭐','🎉','🎊','🏆','💡','📌','✅','❌','⚡','🚀',
];

// Emojis commonly used for reactions
const REACTION_EMOJIS = ['👍','❤️','😂','😮','😢','🔥','👏','🎉','💯','🚀'];

function initEmojiPicker(container, onSelect) {
  container.innerHTML = '';
  EMOJI_LIST.forEach(emoji => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.type = 'button';
    btn.addEventListener('click', () => onSelect(emoji));
    container.appendChild(btn);
  });
}

function createReactionPicker(onSelect) {
  const div = document.createElement('div');
  div.className = 'emoji-picker reaction-picker';
  div.style.cssText = 'position:absolute;bottom:100%;right:0;width:auto;max-height:none;padding:4px;';
  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;gap:2px;';
  REACTION_EMOJIS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.style.cssText = 'font-size:20px;padding:4px;border:none;background:none;cursor:pointer;border-radius:4px;';
    btn.addEventListener('click', () => {
      onSelect(emoji);
      div.remove();
    });
    grid.appendChild(btn);
  });
  div.appendChild(grid);
  return div;
}
