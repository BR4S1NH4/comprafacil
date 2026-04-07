import { test, expect } from '@playwright/test'

test.describe('Login — entrada de credenciais', () => {
  test('credenciais inválidas exibem mensagem de erro', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/ConstruFácil/i)

    await page.getByTestId('login-usuario').fill('usuario_inexistente_e2e')
    await page.getByTestId('login-senha').fill('senha_errada_12345')
    await page.getByTestId('login-submit').click()

    await expect(page.locator('.alert-danger').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('login-usuario')).toBeVisible()
  })

  test('modal administrativo aceita digitação e submete (erro com senha errada)', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByTestId('admin-login-open').click()
    await expect(page.getByRole('heading', { name: /Acesso administrativo/i })).toBeVisible()

    await page.getByTestId('admin-usuario').fill('admin_teste_e2e')
    await page.getByTestId('admin-senha').fill('senha_invalida')
    await page.getByTestId('admin-submit').click()

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
    await page.getByTestId('login-usuario').fill(user)
    await page.getByTestId('login-senha').fill(pass)
    await page.getByTestId('login-submit').click()

    await expect(page.getByRole('button', { name: /Deslogar/i })).toBeVisible({
      timeout: 20_000,
    })
  })
})
