import { CONFIG } from 'src/config-global';

import { MenuView } from 'src/sections/menu/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Menus - ${CONFIG.appName}`}</title>

      <MenuView />
    </>
  );
}

