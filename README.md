# Desafio 2 - Domain Events no agregado Customer

## Sumario Executivo

Este projeto implementa a publicacao e assinatura de eventos de dominio para o agregado `Customer`, usando TypeScript, Jest e o padrao Domain Events do DDD.

Status da validacao:

- Compilacao TypeScript: OK
- Testes automatizados: OK
- Resultado: 13 suites e 46 testes passaram

## Eventos implementados

### CustomerCreatedEvent

Arquivo: `src/domain/customer/event/customer-created.event.ts`

Gatilho validado nos testes: criacao de um novo `Customer` e publicacao do evento via `EventDispatcher.notify()`.

Handlers assinantes:

- `EnviaConsoleLog1Handler`
- `EnviaConsoleLog2Handler`

Saidas esperadas no console:

```text
Esse é o primeiro console.log do evento: CustomerCreated
Esse é o segundo console.log do evento: CustomerCreated
```

### CustomerAddressChangedEvent

Arquivo: `src/domain/customer/event/customer-address-changed.event.ts`

Gatilho validado nos testes: troca do endereco do `Customer` com publicacao do evento via `EventDispatcher.notify()`.

Dados transportados pelo evento:

- `id`
- `name`
- `address`

Handler assinante:

- `EnviaConsoleLogHandler`

Saida esperada no console:

```text
Endereço do cliente: 123, Customer 1 alterado para: Street 1, 10, 12345-000 Sao Paulo
```

## Testes unitarios

Arquivo principal:

```text
src/domain/customer/event/customer-event-dispatcher.spec.ts
```

Cenarios cobertos:

- Publica `CustomerCreatedEvent` e executa dois handlers independentes.
- Valida que o primeiro handler imprime exatamente a primeira mensagem exigida.
- Valida que o segundo handler imprime exatamente a segunda mensagem exigida.
- Publica `CustomerAddressChangedEvent` apos trocar o endereco do customer.
- Valida que o evento transporta `id`, `name` e `address`.
- Valida que o handler de alteracao de endereco imprime exatamente a mensagem exigida.

## Como rodar os testes

Instale as dependencias:

```bash
npm install
```

Execute a suite:

```bash
npm test
```

No PowerShell do Windows, se necessario:

```powershell
npm.cmd test
```

O comando executa:

```bash
npm run tsc -- --noEmit && jest
```

## Resultado da ultima execucao

```text
> test
> npm run tsc -- --noEmit && jest


> tsc
> tsc --noEmit

PASS src/domain/customer/factory/customer.factory.spec.ts
PASS src/domain/@shared/event/event-dispatcher.spec.ts
  ● Console

    console.log
      Sending email to .....

      at SendEmailWhenProductIsCreatedHandler.handle (src/domain/product/event/handler/send-email-when-product-is-created.handler.ts:8:13)
          at Array.forEach (<anonymous>)

PASS src/domain/customer/event/customer-event-dispatcher.spec.ts
PASS src/domain/customer/entity/customer.spec.ts
PASS src/domain/product/service/product.service.spec.ts
PASS src/domain/checkout/entity/order.spec.ts
PASS src/domain/checkout/service/order.service.spec.ts
PASS src/domain/product/entity/product.spec.ts
PASS src/domain/checkout/factory/order.factory.spec.ts
PASS src/domain/product/factory/product.factory.spec.ts
PASS src/infrastructure/customer/repository/sequelize/customer.repository.spec.ts
PASS src/infrastructure/product/repository/sequelize/product.repository.spec.ts
PASS src/infrastructure/order/repository/sequilize/order.repository.spec.ts

Test Suites: 13 passed, 13 total
Tests:       46 passed, 46 total
Snapshots:   0 total
Time:        2.35 s
Ran all test suites.
```
