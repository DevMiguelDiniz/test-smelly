const { UserService } = require('../src/userService');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  describe('createUser', () => {
    test('retorna o usuário criado com um id gerado', () => {
      // Arrange
      const nome = 'Fulano de Tal';
      const email = 'fulano@teste.com';

      // Act
      const usuario = userService.createUser(nome, email, 25);

      // Assert
      expect(usuario.id).toBeDefined();
    });

    test('cria o usuário com status ativo', () => {
      // Arrange & Act
      const usuario = userService.createUser('Fulano', 'fulano@teste.com', 25);

      // Assert
      expect(usuario.status).toBe('ativo');
    });

    test('cria o usuário como não administrador por padrão', () => {
      // Arrange & Act
      const usuario = userService.createUser('Fulano', 'fulano@teste.com', 25);

      // Assert
      expect(usuario.isAdmin).toBe(false);
    });

    test('lança erro ao criar usuário menor de idade', () => {
      // Arrange
      const criarMenor = () => userService.createUser('Menor', 'menor@email.com', 17);

      // Act & Assert
      expect(criarMenor).toThrow('O usuário deve ser maior de idade.');
    });

    test('lança erro quando o nome não é informado', () => {
      // Arrange
      const criarSemNome = () => userService.createUser('', 'sem-nome@email.com', 30);

      // Act & Assert
      expect(criarSemNome).toThrow('Nome, email e idade são obrigatórios.');
    });

    test('não armazena o usuário quando a criação falha', () => {
      // Arrange
      const criarMenor = () => userService.createUser('Menor', 'menor@email.com', 17);

      // Act
      expect(criarMenor).toThrow();

      // Assert
      expect(userService.generateUserReport()).toContain('Nenhum usuário cadastrado.');
    });
  });

  describe('getUserById', () => {
    test('retorna o usuário previamente criado', () => {
      // Arrange
      const criado = userService.createUser('Fulano', 'fulano@teste.com', 25);

      // Act
      const buscado = userService.getUserById(criado.id);

      // Assert
      expect(buscado.nome).toBe('Fulano');
    });

    test('retorna null quando o id não existe', () => {
      // Arrange
      const idInexistente = 'id-que-nao-existe';

      // Act
      const resultado = userService.getUserById(idInexistente);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('retorna true ao desativar um usuário comum', () => {
      // Arrange
      const comum = userService.createUser('Comum', 'comum@teste.com', 30);

      // Act
      const resultado = userService.deactivateUser(comum.id);

      // Assert
      expect(resultado).toBe(true);
    });

    test('marca um usuário comum como inativo após a desativação', () => {
      // Arrange
      const comum = userService.createUser('Comum', 'comum@teste.com', 30);

      // Act
      userService.deactivateUser(comum.id);

      // Assert
      expect(userService.getUserById(comum.id).status).toBe('inativo');
    });

    test('retorna false ao tentar desativar um administrador', () => {
      // Arrange
      const admin = userService.createUser('Admin', 'admin@teste.com', 40, true);

      // Act
      const resultado = userService.deactivateUser(admin.id);

      // Assert
      expect(resultado).toBe(false);
    });

    test('mantém o administrador ativo após tentativa de desativação', () => {
      // Arrange
      const admin = userService.createUser('Admin', 'admin@teste.com', 40, true);

      // Act
      userService.deactivateUser(admin.id);

      // Assert
      expect(userService.getUserById(admin.id).status).toBe('ativo');
    });

    test('retorna false quando o usuário não existe', () => {
      // Arrange
      const idInexistente = 'id-que-nao-existe';

      // Act
      const resultado = userService.deactivateUser(idInexistente);

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('inclui o nome e o status de cada usuário cadastrado', () => {
      // Arrange
      userService.createUser('Alice', 'alice@email.com', 28);
      userService.createUser('Bob', 'bob@email.com', 32);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toEqual(expect.stringContaining('Alice'));
      expect(relatorio).toEqual(expect.stringContaining('Bob'));
      expect(relatorio).toEqual(expect.stringContaining('ativo'));
    });

    test('inclui o id do usuário no relatório', () => {
      // Arrange
      const alice = userService.createUser('Alice', 'alice@email.com', 28);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain(alice.id);
    });

    test('reflete o status inativo de um usuário desativado', () => {
      // Arrange
      const comum = userService.createUser('Comum', 'comum@teste.com', 30);
      userService.deactivateUser(comum.id);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('inativo');
    });

    test('informa que não há usuários quando o cadastro está vazio', () => {
      // Arrange (nenhum usuário criado)

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('Nenhum usuário cadastrado.');
    });
  });
});
