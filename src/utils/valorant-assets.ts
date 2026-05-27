const VALORANT_AGENT_CDN = "https://media.valorant-api.com/agents";

const AGENTS: Record<string, { name: string; uuid: string }> = {
  jett: { name: "Jett", uuid: "add6443a-41bd-e414-f6ad-e58d267f4e95" },
  raze: { name: "Raze", uuid: "f94c3b30-42be-e959-889c-5aa313dba261" },
  omen: { name: "Omen", uuid: "8e253930-4c05-31dd-1b6c-968525494517" },
  sova: { name: "Sova", uuid: "320b2a48-4d9b-a075-30f1-1f93a9b638fa" },
  killjoy: { name: "Killjoy", uuid: "1e58de9c-4950-5125-93e9-a0aee9f98746" },
  clove: { name: "Clove", uuid: "1dbf2edd-4729-0984-3115-daa5eed44993" },
  phoenix: { name: "Phoenix", uuid: "eb93336a-449b-9c1b-0a54-a891f7921d69" },
  sage: { name: "Sage", uuid: "569fdd95-4d10-43ab-ca70-79becc718b46" },
  brimstone: { name: "Brimstone", uuid: "9f0d8ba9-4140-b941-57d3-a7ad57c6b417" },
  viper: { name: "Viper", uuid: "707eab51-4836-f488-046a-cda6bf494859" },
  cypher: { name: "Cypher", uuid: "117ed9e3-49f3-6512-3ccf-0cada7e3823b" },
  reyna: { name: "Reyna", uuid: "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc" },
  breach: { name: "Breach", uuid: "5f8d3a7f-467b-97f3-062c-13acf203c006" },
  skye: { name: "Skye", uuid: "6f2a04ca-43e0-be17-7f36-b3908627744d" },
  yoru: { name: "Yoru", uuid: "7f94d92c-4234-0a36-9646-3a87eb8b5c89" },
  astra: { name: "Astra", uuid: "41fb69c1-4189-7b37-f117-bcaf1e96f1bf" },
  kayo: { name: "KAY/O", uuid: "601dbbe7-43ce-be57-2a40-4abd24953621" },
  chamber: { name: "Chamber", uuid: "22697a3d-45bf-8dd7-4fec-84a9e28c69d7" },
  neon: { name: "Neon", uuid: "bb2a4828-46eb-8cd1-e765-15848195d751" },
  fade: { name: "Fade", uuid: "dade69b4-4f5a-8528-247b-219e5a1facd6" },
  harbor: { name: "Harbor", uuid: "95b78ed7-4637-86d9-7e41-71ba8c293152" },
  gekko: { name: "Gekko", uuid: "e370fa57-4757-3604-3648-499e1f642d3f" },
  deadlock: { name: "Deadlock", uuid: "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235" },
  iso: { name: "Iso", uuid: "0e38b510-41a8-5780-5e8f-568b2a4f2d6c" },
  vyse: { name: "Vyse", uuid: "efba5359-4016-a1e5-7626-b1ae76895940" },
  tejo: { name: "Tejo", uuid: "b444168c-4e35-8076-db47-ef9bf368f384" },
  waylay: { name: "Waylay", uuid: "df1cb487-4902-002e-5c17-d28e83e78588" }
};

const AGENTS_BY_UUID = Object.fromEntries(Object.values(AGENTS).map((agent) => [agent.uuid, agent]));

export const resolveValorantAgentAsset = (agent?: string) => {
  if (!agent) return undefined;

  const key = normalizeAgentKey(agent);
  const resolved = AGENTS[key] ?? AGENTS_BY_UUID[agent.toLowerCase()];
  const uuid = resolved?.uuid ?? (isUuid(agent) ? agent.toLowerCase() : undefined);

  if (!uuid) {
    return {
      name: agent,
      imageUrl: undefined
    };
  }

  return {
    name: resolved?.name ?? agent,
    imageUrl: `${VALORANT_AGENT_CDN}/${uuid}/displayicon.png`
  };
};

const normalizeAgentKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
