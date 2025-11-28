import { CONFIG } from 'src/config-global';

import { RoleView } from 'src/sections/role/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Roles - ${CONFIG.appName}`}</title>

      <RoleView />
    </>
  );
}
