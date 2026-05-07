const DUCK_WORDS = ['quack', 'duck', 'kwak', 'eend'];

const pattern = new RegExp(`\\b(${DUCK_WORDS.join('|')})\\b`, 'gi');

function wrapTextNode(node: Text) {
  const text = node.nodeValue ?? '';
  if (!pattern.test(text)) return;
  pattern.lastIndex = 0;

  const fragment = document.createDocumentFragment();
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      fragment.appendChild(document.createTextNode(text.slice(last, match.index)));
    }
    const span = document.createElement('span');
    span.className = 'duck-word';
    span.textContent = match[0];
    span.addEventListener('click', () => spawnDuck(span));
    fragment.appendChild(span);
    last = pattern.lastIndex;
  }

  if (last < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(last)));
  }

  node.parentNode!.replaceChild(fragment, node);
}

function spawnDuck(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const el = document.createElement('span');
  el.textContent = '🦆';
  el.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top}px;
    font-size: 1.4rem;
    pointer-events: none;
    user-select: none;
    z-index: 9999;
    transform: translateY(0) scale(1);
    opacity: 1;
    transition: transform 0.8s ease-out, opacity 0.8s ease-out;
  `;
  document.body.appendChild(el);
  el.getBoundingClientRect(); // force reflow so transition has a starting state
  el.style.transform = 'translateY(-70px) scale(1.4)';
  el.style.opacity = '0';
  el.addEventListener('transitionend', () => el.remove());
}

function walk(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'PRE') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  nodes.forEach(wrapTextNode);
}

document.addEventListener('DOMContentLoaded', () => walk(document.body));
