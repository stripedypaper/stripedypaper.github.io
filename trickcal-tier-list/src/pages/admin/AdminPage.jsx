import { Group } from '@mantine/core';
import { AdminSidebar } from '../../components/AdminSidebar.jsx';
import { ManageCharactersPage } from './ManageCharactersPage.jsx';
import { ManageCommunityPage } from './ManageCommunityPage.jsx';
import { ManageUsersPage } from './ManageUsersPage.jsx';

export function AdminPage({
  apiBaseUrl,
  route,
  canViewUsers,
  canViewCharacters
}) {
  const routeKey =
    route === 'admin-characters'
      ? 'characters'
      : route === 'admin-community'
        ? 'community'
        : 'users';

  return (
    <Group align="flex-start" gap="xl" className="admin-layout" wrap="nowrap">
      <div className="admin-sidebar-wrap">
        <AdminSidebar
          route={route}
          canViewUsers={canViewUsers}
          canViewCharacters={canViewCharacters}
        />
      </div>
      <div className="admin-content-wrap">
        {routeKey === 'characters' && canViewCharacters ? (
          <ManageCharactersPage apiBaseUrl={apiBaseUrl} />
        ) : routeKey === 'community' && canViewUsers ? (
          <ManageCommunityPage
            apiBaseUrl={apiBaseUrl}
            questionnaireVersion={questionnaireVersion}
          />
        ) : canViewUsers ? (
          <ManageUsersPage apiBaseUrl={apiBaseUrl} />
        ) : null}
      </div>
    </Group>
  );
}
