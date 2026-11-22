/* 只增强现有界面的语义、焦点与键盘访问，不修改业务数据。 */
(() => {
  'use strict';
  let lastFocus = null;
  document.addEventListener('focusin', event => { lastFocus = event.target; });

  function enhance() {
    document.querySelectorAll('h1, dialog h2').forEach(heading => { heading.tabIndex = -1; });
    document.querySelectorAll('thead th').forEach(th => th.setAttribute('scope', 'col'));
    document.querySelectorAll('.table-wrap, .plan-ai pre, .plan-ai-preview pre').forEach(element => {
      element.tabIndex = 0;
      element.setAttribute('role', 'region');
      element.setAttribute('aria-label', element.matches('pre') ? 'AI 规划内容，可滚动阅读' : '数据表格，可横向滚动');
    });
    document.querySelectorAll('.field').forEach(field => {
      const input = field.querySelector('input:not([type="hidden"]), select, textarea');
      const hint = field.querySelector('.hint');
      if (input?.id && hint) {
        hint.id = `${input.id}-hint`;
        input.setAttribute('aria-describedby', hint.id);
      }
    });
    document.querySelectorAll('tr, .plan-card').forEach(row => {
      const title = row.querySelector('.cell-title, .plan-title')?.textContent.trim();
      if (!title) return;
      row.querySelectorAll('button[data-id]').forEach(button => {
        // 计划卡内的任务按钮由所属表格行命名。
        if (row.matches('.plan-card') && button.closest('tr')) return;
        button.setAttribute('aria-label', `${button.textContent.trim()}：${title}`);
      });
      row.querySelectorAll('.proof-thumb').forEach(img => {
        img.alt = `${title}的打卡图片凭证（在新标签页打开）`;
      });
    });
    // 列表重绘后，恢复同一操作的焦点；条目已删除则回到页面标题。
    if (lastFocus && !lastFocus.isConnected && document.activeElement === document.body) {
      const previous = lastFocus;
      const candidates = previous.id ? [document.getElementById(previous.id)] :
        [...document.querySelectorAll('button[data-action]')].filter(button =>
          ['action', 'id', 'planId', 'level', 'page'].every(key => button.dataset[key] === previous.dataset[key]));
      const scope = document.querySelector('dialog[open]') || document;
      const target = candidates.find(element => element && !element.disabled && !element.closest('[hidden]') && scope.contains(element));
      (target || scope.querySelector('h1, h2'))?.focus();
    }
  }

  document.addEventListener('keydown', event => {
    const picker = document.getElementById('date-picker');
    if (event.key !== 'Tab' || !picker?.contains(event.target)) return;
    const controls = [...picker.querySelectorAll('button:not(:disabled), select')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && event.target === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && event.target === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('focusout', event => {
    // 离开非模态聊天区域后不强制锁住焦点。
    if (event.target.matches('input, textarea, select')) event.target.removeAttribute('aria-invalid');
  });
  document.addEventListener('invalid', event => event.target.setAttribute('aria-invalid', 'true'), true);
  new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
  enhance();
})();
