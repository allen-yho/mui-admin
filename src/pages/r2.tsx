import { CONFIG } from 'src/config-global';

import { R2StorageView } from 'src/sections/r2-storage/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`R2 Storage - ${CONFIG.appName}`}</title>
      <meta name="description" content="R2 Storage management" />
      <meta name="keywords" content="r2,storage,cloud,file" />

      <R2StorageView />
    </>
  );
}

