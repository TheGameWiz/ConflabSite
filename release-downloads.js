(() => {
  const buttons = [...document.querySelectorAll('[data-release-asset]')];
  if (!buttons.length) return;

  const releasesApi = 'https://api.github.com/repos/TheGameWiz/ConflabSite/releases?per_page=100';

  function markUnavailable(button) {
    button.removeAttribute('href');
    button.classList.add('is-disabled');
    button.setAttribute('aria-disabled', 'true');
    button.setAttribute('tabindex', '-1');
    button.title = 'Download currently unavailable';
  }

  function markAvailable(button, downloadUrl) {
    button.href = downloadUrl;
    button.classList.remove('is-disabled');
    button.removeAttribute('aria-disabled');
    button.removeAttribute('tabindex');
    button.title = '';
  }

  buttons.forEach(markUnavailable);

  fetch(releasesApi, {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then((response) => {
      if (!response.ok) throw new Error(`GitHub release lookup failed: ${response.status}`);
      return response.json();
    })
    .then((releases) => {
      const newestPublishedFirst = (releases || [])
        .filter((release) => !release.draft && !release.prerelease)
        .sort((left, right) => {
          const rightDate = Date.parse(right.published_at || right.created_at || 0);
          const leftDate = Date.parse(left.published_at || left.created_at || 0);
          return rightDate - leftDate;
        });

      const assetsByName = new Map();
      newestPublishedFirst.forEach((release) => {
        (release.assets || []).forEach((asset) => {
          if (!assetsByName.has(asset.name)) {
            assetsByName.set(asset.name, asset.browser_download_url);
          }
        });
      });

      buttons.forEach((button) => {
        const downloadUrl = assetsByName.get(button.dataset.releaseAsset);
        if (downloadUrl) markAvailable(button, downloadUrl);
      });
    })
    .catch(() => {
      // Fail closed: buttons remain visibly disabled if availability cannot be verified.
    });
})();
