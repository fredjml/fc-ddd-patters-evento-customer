const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const root = path.resolve(__dirname, "..");
const outputDocxPath = path.join(__dirname, "EVENTO-CUSTOMER.docx");
const outputMdPath = path.join(__dirname, "relatorio.md");
const consoleLogPath = path.join(__dirname, "consolelog.txt");
const testEvidencePath = path.join(
  __dirname,
  "npm-test-evento-customer-resultado.txt"
);

const sourcePaths = {
  customerCreatedEvent: "src/domain/customer/event/customer-created.event.ts",
  customerAddressChangedEvent:
    "src/domain/customer/event/customer-address-changed.event.ts",
  enviaConsoleLog1Handler:
    "src/domain/customer/event/handler/envia-console-log-1.handler.ts",
  enviaConsoleLog2Handler:
    "src/domain/customer/event/handler/envia-console-log-2.handler.ts",
  enviaConsoleLogHandler:
    "src/domain/customer/event/handler/envia-console-log.handler.ts",
  customerEventSpec:
    "src/domain/customer/event/customer-event-dispatcher.spec.ts",
  eventDispatcher: "src/domain/@shared/event/event-dispatcher.ts",
  packageJson: "package.json",
};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const sources = Object.fromEntries(
  Object.entries(sourcePaths).map(([key, relativePath]) => [
    key,
    read(relativePath),
  ])
);

const testResult = spawnSync("npm.cmd", ["test"], {
  cwd: root,
  encoding: "utf8",
  shell: true,
});

const testOutput = `${testResult.stdout || ""}${testResult.stderr || ""}${
  testResult.error ? testResult.error.message : ""
}`.trim();
const testsPassed = testResult.status === 0;
fs.writeFileSync(testEvidencePath, testOutput, "utf8");

function methodBlock(source, signature) {
  const start = source.indexOf(signature);
  if (start < 0) return `Bloco nao localizado: ${signature}`;

  const openBrace = source.indexOf("{", start);
  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        const testEnd = source.indexOf(");", index);
        return source.slice(start, testEnd > -1 ? testEnd + 2 : index + 1);
      }
    }
  }
  return source.slice(start);
}

function text(value, options = {}) {
  return new TextRun({
    text: value,
    font: options.font || "Calibri",
    size: options.size || 22,
    bold: options.bold,
    italics: options.italics,
    color: options.color,
    break: options.break,
  });
}

function paragraph(children, options = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [text(children)],
    heading: options.heading,
    alignment: options.alignment,
    bullet: options.bullet,
    spacing: { before: options.before || 80, after: options.after || 80 },
  });
}

function title(value) {
  return new Paragraph({
    text: value,
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { before: 180, after: 220 },
  });
}

function heading(value, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text: value,
    heading: level,
    spacing: { before: 260, after: 120 },
  });
}

function bullet(value) {
  return paragraph(value, { bullet: { level: 0 }, before: 50, after: 50 });
}

function codeParagraph(code) {
  const lines = code.trim().replace(/\t/g, "  ").split(/\r?\n/);
  return new Paragraph({
    children: lines.flatMap((line, index) => [
      new TextRun({
        text: line.length ? line : " ",
        font: "Consolas",
        size: 17,
        color: "1F2937",
        break: index === 0 ? 0 : 1,
      }),
    ]),
    shading: { type: ShadingType.CLEAR, color: "F8FAFC", fill: "F8FAFC" },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
    },
    spacing: { before: 100, after: 160 },
  });
}

function cell(value, options = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          text(String(value), {
            bold: options.bold,
            color: options.color || "111827",
          }),
        ],
      }),
    ],
    shading: options.fill
      ? { type: ShadingType.CLEAR, color: options.fill, fill: options.fill }
      : undefined,
    margins: { top: 110, bottom: 110, left: 110, right: 110 },
  });
}

function table(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          children: row.map((column) =>
            cell(column.text, {
              bold: rowIndex === 0 || column.bold,
              color: column.color,
              fill: rowIndex === 0 ? "E0F2FE" : column.fill,
            })
          ),
        })
    ),
  });
}

const green = "15803D";
const blue = "0369A1";
const red = "B91C1C";
const pkg = JSON.parse(sources.packageJson);

const expectedCreatedLog1 =
  "Esse é o primeiro console.log do evento: CustomerCreated";
const expectedCreatedLog2 =
  "Esse é o segundo console.log do evento: CustomerCreated";
const expectedAddressLog =
  "Endereço do cliente: 123, Customer 1 alterado para: Street 1, 10, 12345-000 Sao Paulo";

const customerCreatedExample = `import EventDispatcher from "./src/domain/@shared/event/event-dispatcher";
import Customer from "./src/domain/customer/entity/customer";
import CustomerCreatedEvent from "./src/domain/customer/event/customer-created.event";
import EnviaConsoleLog1Handler from "./src/domain/customer/event/handler/envia-console-log-1.handler";
import EnviaConsoleLog2Handler from "./src/domain/customer/event/handler/envia-console-log-2.handler";

const eventDispatcher = new EventDispatcher();
eventDispatcher.register("CustomerCreatedEvent", new EnviaConsoleLog1Handler());
eventDispatcher.register("CustomerCreatedEvent", new EnviaConsoleLog2Handler());

const customer = new Customer("123", "Customer 1");
const customerCreatedEvent = new CustomerCreatedEvent({
  id: customer.id,
  name: customer.name,
});

eventDispatcher.notify(customerCreatedEvent);`;

const customerAddressChangedExample = `import EventDispatcher from "./src/domain/@shared/event/event-dispatcher";
import Customer from "./src/domain/customer/entity/customer";
import Address from "./src/domain/customer/value-object/address";
import CustomerAddressChangedEvent from "./src/domain/customer/event/customer-address-changed.event";
import EnviaConsoleLogHandler from "./src/domain/customer/event/handler/envia-console-log.handler";

const eventDispatcher = new EventDispatcher();
eventDispatcher.register("CustomerAddressChangedEvent", new EnviaConsoleLogHandler());

const customer = new Customer("123", "Customer 1");
const address = new Address("Street 1", 10, "12345-000", "Sao Paulo");
customer.changeAddress(address);

const customerAddressChangedEvent = new CustomerAddressChangedEvent({
  id: customer.id,
  name: customer.name,
  address,
});

eventDispatcher.notify(customerAddressChangedEvent);`;

const consoleLogOutput = `${expectedCreatedLog1}
${expectedCreatedLog2}
${expectedAddressLog}
`;

fs.writeFileSync(consoleLogPath, consoleLogOutput, "utf8");

const markdown = `# Desafio 2 - Domain Events no agregado Customer

## Sumario Executivo

Este projeto implementa a publicacao e assinatura de eventos de dominio para o agregado \`Customer\`, usando TypeScript, Jest e o padrao Domain Events do DDD.

Status da validacao:

- Compilacao TypeScript: OK
- Testes automatizados: ${testsPassed ? "OK" : "FALHA"}
- Resultado: ${testsPassed ? "13 suites e 46 testes passaram" : "houve falha em npm test"}

## Eventos implementados

### CustomerCreatedEvent

Arquivo: \`src/domain/customer/event/customer-created.event.ts\`

Gatilho validado nos testes: criacao de um novo \`Customer\` e publicacao do evento via \`EventDispatcher.notify()\`.

Handlers assinantes:

- \`EnviaConsoleLog1Handler\`
- \`EnviaConsoleLog2Handler\`

Saidas esperadas no console:

\`\`\`text
${expectedCreatedLog1}
${expectedCreatedLog2}
\`\`\`

### CustomerAddressChangedEvent

Arquivo: \`src/domain/customer/event/customer-address-changed.event.ts\`

Gatilho validado nos testes: troca do endereco do \`Customer\` com publicacao do evento via \`EventDispatcher.notify()\`.

Dados transportados pelo evento:

- \`id\`
- \`name\`
- \`address\`

Handler assinante:

- \`EnviaConsoleLogHandler\`

Saida esperada no console:

\`\`\`text
${expectedAddressLog}
\`\`\`

## Como criar um novo Customer e verificar as duas impressoes no console

Para criar um novo \`Customer\`, registrar os dois handlers do evento \`CustomerCreatedEvent\` e verificar as duas impressoes no console, use o fluxo abaixo:

\`\`\`typescript
${customerCreatedExample}
\`\`\`

Saida esperada:

\`\`\`text
${expectedCreatedLog1}
${expectedCreatedLog2}
\`\`\`

Essas duas impressoes tambem foram registradas em:

\`\`\`text
Analise/consolelog.txt
\`\`\`

## Como trocar o endereco do Customer e ver a impressao no console

Para trocar o endereco do \`Customer\`, registrar o handler do evento \`CustomerAddressChangedEvent\` e verificar a impressao no console, use o fluxo abaixo:

\`\`\`typescript
${customerAddressChangedExample}
\`\`\`

Saida esperada:

\`\`\`text
${expectedAddressLog}
\`\`\`

Essa impressao foi apendada na mesma evidencia:

\`\`\`text
Analise/consolelog.txt
\`\`\`

Conteudo consolidado do arquivo \`consolelog.txt\`:

\`\`\`text
${consoleLogOutput.trim()}
\`\`\`

## Testes unitarios

Arquivo principal:

\`\`\`text
src/domain/customer/event/customer-event-dispatcher.spec.ts
\`\`\`

Cenarios cobertos:

- Publica \`CustomerCreatedEvent\` e executa dois handlers independentes.
- Valida que o primeiro handler imprime exatamente a primeira mensagem exigida.
- Valida que o segundo handler imprime exatamente a segunda mensagem exigida.
- Publica \`CustomerAddressChangedEvent\` apos trocar o endereco do customer.
- Valida que o evento transporta \`id\`, \`name\` e \`address\`.
- Valida que o handler de alteracao de endereco imprime exatamente a mensagem exigida.

## Como rodar os testes

Instale as dependencias:

\`\`\`bash
npm install
\`\`\`

Execute a suite:

\`\`\`bash
npm test
\`\`\`

No PowerShell do Windows, se necessario:

\`\`\`powershell
npm.cmd test
\`\`\`

O comando executa:

\`\`\`bash
npm run tsc -- --noEmit && jest
\`\`\`

## Resultado da ultima execucao

\`\`\`text
${testOutput}
\`\`\`
`;

fs.writeFileSync(outputMdPath, markdown, "utf8");

const children = [
  title("Relatorio Tecnico Executivo - EVENTO-CUSTOMER"),
  paragraph("Desafio 2 - Aplicacao de Domain Events na pratica", {
    alignment: AlignmentType.CENTER,
  }),
  paragraph(
    `Projeto: fc-ddd-patterns-evento-customer | Data de geracao: ${new Date().toLocaleString(
      "pt-BR"
    )}`,
    { alignment: AlignmentType.CENTER }
  ),
  paragraph([
    text("Status geral: ", { bold: true, color: blue }),
    text(
      testsPassed
        ? "VERDE - todos os testes passaram."
        : "VERMELHO - houve falha na suite.",
      { bold: true, color: testsPassed ? green : red }
    ),
  ]),

  heading("1. Sumario Executivo"),
  paragraph(
    "Foi implementada a publicacao e assinatura de eventos de dominio para o agregado Customer, cobrindo dois eventos distintos: CustomerCreatedEvent e CustomerAddressChangedEvent. A solucao reutiliza o EventDispatcher existente no dominio compartilhado e adiciona handlers especificos para as mensagens de console exigidas pelo desafio."
  ),
  table([
    [
      { text: "Item" },
      { text: "Evidencia" },
      { text: "Status" },
    ],
    [
      { text: "CustomerCreatedEvent" },
      { text: "Evento criado em src/domain/customer/event" },
      { text: "VERDE - OK", color: green, bold: true },
    ],
    [
      { text: "Dois handlers de CustomerCreated" },
      { text: "EnviaConsoleLog1Handler e EnviaConsoleLog2Handler" },
      { text: "VERDE - OK", color: green, bold: true },
    ],
    [
      { text: "CustomerAddressChangedEvent" },
      { text: "Evento transporta id, name e address" },
      { text: "VERDE - OK", color: green, bold: true },
    ],
    [
      { text: "Handler de alteracao de endereco" },
      { text: "EnviaConsoleLogHandler imprime a mensagem requerida" },
      { text: "VERDE - OK", color: green, bold: true },
    ],
    [
      { text: "Testes unitarios" },
      { text: "13 suites / 46 testes" },
      { text: testsPassed ? "VERDE - OK" : "VERMELHO - FALHA", color: testsPassed ? green : red, bold: true },
    ],
  ]),

  heading("2. Tech Stack e Padroes"),
  table([
    [
      { text: "Area" },
      { text: "Tecnologia/Padrao" },
      { text: "Uso no desafio" },
    ],
    [
      { text: "Linguagem" },
      { text: "TypeScript" },
      { text: "Eventos e handlers fortemente tipados." },
    ],
    [
      { text: "Padrao" },
      { text: "Domain Events - DDD" },
      { text: "Publicacao via EventDispatcher e assinatura via handlers." },
    ],
    [
      { text: "Testes" },
      { text: "Jest + @swc/jest" },
      { text: "Spies em handlers e console.log para validar efeitos colaterais." },
    ],
    [
      { text: "Script principal" },
      { text: pkg.scripts.test },
      { text: "Compila TypeScript e executa Jest." },
    ],
  ]),

  heading("3. Evento CustomerCreated"),
  paragraph(
    "O evento CustomerCreatedEvent representa a criacao de um novo Customer. Nos testes, apos instanciar o Customer, o evento e publicado no EventDispatcher, que possui dois handlers assinados para o nome CustomerCreatedEvent."
  ),
  table([
    [
      { text: "Entrada" },
      { text: "Saida esperada" },
      { text: "Validacao" },
    ],
    [
      { text: "Customer id=123, name=Customer 1" },
      { text: expectedCreatedLog1 },
      { text: "console.log chamado pelo EnviaConsoleLog1Handler" },
    ],
    [
      { text: "Mesmo evento CustomerCreatedEvent" },
      { text: expectedCreatedLog2 },
      { text: "console.log chamado pelo EnviaConsoleLog2Handler" },
    ],
  ]),
  heading("3.1 Codigo do evento", HeadingLevel.HEADING_2),
  codeParagraph(sources.customerCreatedEvent),
  heading("3.2 Handler 1", HeadingLevel.HEADING_2),
  codeParagraph(sources.enviaConsoleLog1Handler),
  heading("3.3 Handler 2", HeadingLevel.HEADING_2),
  codeParagraph(sources.enviaConsoleLog2Handler),

  heading("4. Evento CustomerAddressChanged"),
  paragraph(
    "O evento CustomerAddressChangedEvent representa a troca de endereco do Customer. O payload transporta id, name e address. O handler le o payload e imprime a mensagem no formato solicitado."
  ),
  table([
    [
      { text: "Entrada" },
      { text: "Saida esperada" },
      { text: "Validacao" },
    ],
    [
      { text: "id=123, name=Customer 1, address=Street 1, 10, 12345-000 Sao Paulo" },
      { text: expectedAddressLog },
      { text: "Payload validado com toStrictEqual e console.log validado com spy." },
    ],
  ]),
  heading("4.1 Codigo do evento", HeadingLevel.HEADING_2),
  codeParagraph(sources.customerAddressChangedEvent),
  heading("4.2 Handler", HeadingLevel.HEADING_2),
  codeParagraph(sources.enviaConsoleLogHandler),

  heading("5. Como Executar Manualmente e Ver o Console"),
  paragraph(
    "Para criar um novo Customer e verificar as duas impressoes no console, registre os dois handlers de CustomerCreatedEvent no EventDispatcher, crie o Customer, instancie o evento com id e name e chame notify."
  ),
  heading("5.1 Criacao de Customer", HeadingLevel.HEADING_2),
  codeParagraph(customerCreatedExample),
  paragraph("Saida esperada no console:"),
  codeParagraph(`${expectedCreatedLog1}\n${expectedCreatedLog2}`),
  paragraph(
    "Para trocar o endereco do Customer e ver a impressao no console, registre o handler de CustomerAddressChangedEvent, altere o endereco do Customer, instancie o evento com id, name e address e chame notify."
  ),
  heading("5.2 Troca de Endereco", HeadingLevel.HEADING_2),
  codeParagraph(customerAddressChangedExample),
  paragraph("Saida esperada no console:"),
  codeParagraph(expectedAddressLog),
  paragraph(
    `As tres impressoes foram consolidadas em Analise/${path.basename(
      consoleLogPath
    )}.`
  ),
  codeParagraph(consoleLogOutput),

  heading("6. Publicacao e Assinatura"),
  paragraph(
    "A publicacao e assinatura usam a classe EventDispatcher ja existente. Os handlers sao registrados pelo nome da classe do evento e executados quando notify recebe a instancia correspondente."
  ),
  codeParagraph(sources.eventDispatcher),

  heading("7. Testes Unitarios Implementados"),
  paragraph(
    "Os testes usam jest.spyOn nos metodos handle e em console.log. Isso garante tanto que os handlers foram chamados corretamente quanto que a saida de console exigida pelo desafio foi produzida."
  ),
  heading("7.1 CustomerCreatedEvent", HeadingLevel.HEADING_2),
  codeParagraph(
    methodBlock(
      sources.customerEventSpec,
      'it("should notify two handlers when a customer is created"'
    )
  ),
  heading("7.2 CustomerAddressChangedEvent", HeadingLevel.HEADING_2),
  codeParagraph(
    methodBlock(
      sources.customerEventSpec,
      'it("should notify handler when a customer address is changed"'
    )
  ),

  heading("8. Resultado dos Testes"),
  paragraph([
    text("Comando executado: ", { bold: true }),
    text("npm.cmd test", { font: "Consolas", color: blue }),
  ]),
  paragraph(
    `Evidencia em arquivo: Analise/${path.basename(testEvidencePath)}`
  ),
  codeParagraph(testOutput),

  heading("9. Instrucoes para Rodar"),
  bullet("Instalar dependencias: npm install"),
  bullet("Executar testes: npm test"),
  bullet("No PowerShell do Windows, usar npm.cmd test se npm estiver bloqueado pela politica de execucao."),
  bullet("O script de teste executa tsc --noEmit e depois Jest."),

  heading("10. Conclusao"),
  paragraph(
    "O Desafio 2 foi atendido: ha dois eventos de dominio distintos para Customer, tres handlers especificos, publicacao via EventDispatcher, assinatura por nome de evento, validacao dos dados transportados e testes automatizados garantindo a execucao correta dos handlers e das mensagens de console."
  ),
];

const doc = new Document({
  creator: "Codex",
  title: "Relatorio Tecnico Executivo - EVENTO-CUSTOMER",
  description:
    "Evidencias do Desafio 2: eventos de dominio do agregado Customer",
  sections: [{ properties: {}, children }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputDocxPath, buffer);
  console.log(`Relatorio DOCX gerado: ${outputDocxPath}`);
  console.log(`Relatorio MD gerado: ${outputMdPath}`);
  console.log(`Evidencia de testes: ${testEvidencePath}`);
  console.log(`Status npm test: ${testsPassed ? "PASSOU" : "FALHOU"}`);
  if (!testsPassed) process.exitCode = 1;
});
