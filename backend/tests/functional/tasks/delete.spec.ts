import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * `DELETE /api/v1/tasks/:id`. La spec de `tasks` no contempla el borrado, así
 * que estos tests no cuelgan de ningún requisito: fijan el contrato del
 * endpoint (204 sin cuerpo, 404 si no existe, 401 sin sesión).
 */
test.group('Tasks | borrar', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function sesionConTarea(client: any) {
    const user = await User.create({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secreto123',
    })
    const login = await client
      .post('/api/v1/auth/login')
      .json({ email: 'ada@example.com', password: 'secreto123' })
    const token = login.body().data.token as string
    const task = await Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: user.id,
    })

    return { token, task }
  }

  test('borra la tarea y responde 204 sin cuerpo', async ({ client, assert }) => {
    const { token, task } = await sesionConTarea(client)

    const response = await client
      .delete(`/api/v1/tasks/${task.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(204)
    assert.isEmpty(response.text())
    assert.isNull(await Task.find(task.id))
  })

  test('responde 404 si la tarea no existe', async ({ client }) => {
    const { token, task } = await sesionConTarea(client)

    const response = await client
      .delete(`/api/v1/tasks/${task.id + 1000}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })

  test('sin token responde 401 y no borra nada', async ({ client, assert }) => {
    const { task } = await sesionConTarea(client)

    const response = await client.delete(`/api/v1/tasks/${task.id}`)

    response.assertStatus(401)
    assert.isNotNull(await Task.find(task.id))
  })
})
