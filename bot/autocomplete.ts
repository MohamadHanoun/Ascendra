type AutocompleteContext = {
  siteUrl: string;
  apiTimeoutMs: number;
};

type AutocompleteOption = {
  name: string;
  value: string;
};

function getAutocompleteEntity(commandName: string) {
  if (commandName === "tournament" || commandName === "results") {
    return "tournament";
  }

  if (
    commandName === "team" ||
    commandName === "roster" ||
    commandName === "teamresults"
  ) {
    return "team";
  }

  if (commandName === "match") {
    return "match";
  }

  return "";
}

async function fetchAutocompleteOptions(params: {
  ctx: AutocompleteContext;
  entity: string;
  query: string;
}) {
  const botApiToken = process.env.BOT_API_TOKEN || "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.ctx.apiTimeoutMs);

  const query = new URLSearchParams({
    entity: params.entity,
    query: params.query,
  });

  try {
    const response = await fetch(
      `${params.ctx.siteUrl}/api/bot/autocomplete?${query.toString()}`,
      {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${botApiToken}`,
        },
      },
    );

    if (!response.ok) {
      return [] as AutocompleteOption[];
    }

    const data = await response.json();

    if (!data?.success || !Array.isArray(data.options)) {
      return [] as AutocompleteOption[];
    }

    return data.options.slice(0, 25) as AutocompleteOption[];
  } catch {
    return [] as AutocompleteOption[];
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleAutocompleteInteraction(
  interaction: any,
  ctx: AutocompleteContext,
) {
  const entity = getAutocompleteEntity(interaction.commandName);

  if (!entity) {
    await interaction.respond([]);
    return;
  }

  const focusedValue = String(interaction.options?.getFocused() || "").trim();

  const options = await fetchAutocompleteOptions({
    ctx,
    entity,
    query: focusedValue,
  });

  await interaction.respond(options);
}
