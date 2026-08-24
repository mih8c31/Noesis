document.addEventListener('DOMContentLoaded', () => {
  // Try to refresh session on load
  if (supabase.isAuthenticated) {
    supabase.refreshSession().then(() => initRouter());
  } else {
    initRouter();
  }
});

function initRouter() {
  router
    .on('/login', () => Auth.renderLogin())
    .on('/register', () => {
      Auth.renderLogin();
      setTimeout(() => {
        const regTab = document.querySelector('[data-tab="register"]');
        if (regTab) regTab.click();
      }, 50);
    })
    .on('/dashboard', () => {
      if (!supabase.isAuthenticated) { router.navigate('/login'); return; }
      Documents.renderDashboard();
    })
    .on('/reader/:id', () => {
      if (!supabase.isAuthenticated) { router.navigate('/login'); return; }
      const id = router.currentPath.split('/reader/')[1];
      if (id) Reader.render(id);
    })
    .on('/', () => {
      if (supabase.isAuthenticated) router.navigate('/dashboard');
      else router.navigate('/login');
    })
    .on('*', () => {
      if (supabase.isAuthenticated) router.navigate('/dashboard');
      else router.navigate('/login');
    });

  router.navigate();
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
