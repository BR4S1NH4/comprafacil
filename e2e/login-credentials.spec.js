import { test, expect } from '@playwright/test'

/** Compatível com builds antigos (placeholders) e com data-testid atual. */
function loginUsuario(page) {
  return page.getByTestId('login-usuario').or(page.getByPlaceholder('Digite o usuario'))
}
function loginSenha(page) {
  return page.getByTestId('login-senha').or(page.getByPlaceholder('Digite a senha').first())
}
function loginSubmit(page) {
  return page.getByTestId('login-submit').or(page.getByRole('button', { name: /Entrar no sistema/i }))
}
function adminOpen(page) {
  return page
    .getByTestId('admin-login-open')
    .or(page.getByRole('button', { name: /Acessar login administrativo/i }))
}
function adminUsuario(page) {
  return page.getByTestId('admin-usuario').or(page.getByPlaceholder('Digite o usuario admin'))
}
function adminSenha(page) {
  return page.getByTestId('admin-senha').or(page.getByPlaceholder('Digite a senha do admin'))
}
function adminSubmit(page) {
  return page
    .getByTestId('admin-submit')
    .or(page.getByRole('button', { name: /Entrar como administrador/i }))
}

test.describe('Login — entrada de credenciais', () => {
  test('credenciais inválidas exibem mensagem de erro', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/ConstruFácil/i)

    await loginUsuario(page).fill('usuario_inexistente_e2e')
    await loginSenha(page).fill('senha_errada_12345')
    await loginSubmit(page).click()

    await expect(page.locator('.alert-danger').first()).toBeVisible({ timeout: 15_000 })
    await expect(loginUsuario(page)).toBeVisible()
  })

  test('modal administrativo aceita digitação e submete (erro com senha errada)', async ({
    page,
  }) => {
    await page.goto('/')
    await adminOpen(page).click()
    await expect(page.getByRole('heading', { name: /Acesso administrativo/i })).toBeVisible()

    await adminUsuario(page).fill('admin_teste_e2e')
    await adminSenha(page).fill('senha_invalida')
    await adminSubmit(page).click()

    const modal = page.locator('.modal').filter({ hasText: 'Acesso administrativo' })
    await expect(modal.locator('.alert-danger')).toBeVisible({ timeout: 15_000 })
  })

  test('login bem-sucedido (opcional: defina E2E_LOGIN_USER e E2E_LOGIN_PASSWORD)', async ({
    page,
  }) => {
    const user = process.env.E2E_LOGIN_USER
    const pass = process.env.E2E_LOGIN_PASSWORD
    test.skip(!user || !pass, 'Defina E2E_LOGIN_USER e E2E_LOGIN_PASSWORD para este teste.')

    await page.goto('/')
    await loginUsuario(page).fill(user)
    await loginSenha(page).fill(pass)
    await loginSubmit(page).click()

    await expect(page.getByRole('button', { name: /Deslogar/i })).toBeVisible({
      timeout: 20_000,
    })
  })
})
