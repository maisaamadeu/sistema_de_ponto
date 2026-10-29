# Firestore (pendente)

Esta pasta reservará os adapters `FirestoreTimeEntryRepository` e
`FirestoreWorkSettingsRepository`, implementando as mesmas portas de
`domain/repositories`.

Nesta etapa **não** há SDK Firebase nem autenticação. Quando forem adicionados:

1. Implementar as interfaces existentes sem alterar entidades/casos de uso.
2. Trocar o binding em `infrastructure/di/container.ts`.
3. Manter o domínio e as features agnósticos ao backend.
