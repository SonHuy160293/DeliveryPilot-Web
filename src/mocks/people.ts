/** Fictional personas only; these records never establish real admission or permissions. */
export interface MockPerson {
  id: string;
  key: string;
  displayName: string;
  primaryEmail: string;
}
export const MOCK_PEOPLE = [
  {
    id: "019a2000-0000-7000-8000-000000000001",
    key: "u-mai",
    displayName: "Mai Tran",
    primaryEmail: "mai.tran@northwind.example",
  },
  {
    id: "019a2000-0000-7000-8000-000000000002",
    key: "u-daniel",
    displayName: "Daniel Okafor",
    primaryEmail: "daniel.okafor@northwind.example",
  },
  {
    id: "019a2000-0000-7000-8000-000000000003",
    key: "u-linh",
    displayName: "Linh Pham",
    primaryEmail: "linh.pham@northwind.example",
  },
  {
    id: "019a2000-0000-7000-8000-000000000004",
    key: "u-sofia",
    displayName: "Sofia Reyes",
    primaryEmail: "sofia.reyes@northwind.example",
  },
  {
    id: "019a2000-0000-7000-8000-000000000005",
    key: "u-arjun",
    displayName: "Arjun Mehta",
    primaryEmail: "arjun.mehta@northwind.example",
  },
  {
    id: "019a2000-0000-7000-8000-000000000006",
    key: "u-hannah",
    displayName: "Hannah Berg",
    primaryEmail: "hannah.berg@northwind.example",
  },
  {
    id: "019a2000-0000-7000-8000-000000000007",
    key: "u-tomasz",
    displayName: "Tomasz Nowak",
    primaryEmail: "tomasz.nowak@larkspur.example",
  },
  {
    id: "019a2000-0000-7000-8000-000000000008",
    key: "u-grace",
    displayName: "Grace Liu",
    primaryEmail: "grace.liu@larkspur.example",
  },
  {
    id: "019a2000-0000-7000-8000-000000000009",
    key: "u-oskar",
    displayName: "Oskar Lind",
    primaryEmail: "oskar.lind@northwind.example",
  },
] as const satisfies readonly MockPerson[];
export type MockPersonaKey = (typeof MOCK_PEOPLE)[number]["key"];
export interface MockWorkspace {
  organizationId: string;
  name: string;
  members: readonly {
    userKey: MockPersonaKey;
    roles: readonly string[];
    permissionCodes: readonly string[];
  }[];
}
export const MOCK_WORKSPACES = [
  {
    organizationId: "019a1000-0000-7000-8000-000000000001",
    name: "Northwind Delivery Studio",
    members: [
      {
        userKey: "u-mai",
        roles: ["Owner"],
        permissionCodes: [
          "organization.projects.create",
          "organization.engagements.create",
          "organization.engagements.read-all",
          "organization.engagements.manage",
          "organization.members.read",
          "organization.audit.read",
        ],
      },
      {
        userKey: "u-daniel",
        roles: ["Admin"],
        permissionCodes: [
          "organization.projects.create",
          "organization.engagements.create",
          "organization.engagements.read-all",
          "organization.engagements.manage",
          "organization.members.read",
        ],
      },
      {
        userKey: "u-linh",
        roles: ["Member", "Delivery lead"],
        permissionCodes: [
          "organization.projects.create",
          "organization.engagements.create",
          "organization.engagements.read-all",
        ],
      },
      {
        userKey: "u-sofia",
        roles: ["Member"],
        permissionCodes: [],
      },
      {
        userKey: "u-arjun",
        roles: ["Member"],
        permissionCodes: [],
      },
      {
        userKey: "u-hannah",
        roles: ["Member"],
        permissionCodes: [],
      },
    ],
  },
  {
    organizationId: "019a1000-0000-7000-8000-000000000002",
    name: "Larkspur Retail Group",
    members: [
      {
        userKey: "u-tomasz",
        roles: ["Owner"],
        permissionCodes: [],
      },
      {
        userKey: "u-grace",
        roles: ["Member"],
        permissionCodes: [],
      },
    ],
  },
] as const satisfies readonly MockWorkspace[];
