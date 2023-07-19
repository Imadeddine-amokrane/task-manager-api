const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, setUpDatabase } = require('./fixtures/db');

beforeEach(setUpDatabase);

test('Sign up new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Imad',
      email: 'ma@h.com',
      password: 'pass!12345',
    })
    .expect(201);
  const user = User.findById(response.body.user._id);
  expect(user).not.toBeNull();
});

test('sign in as userOne', async () => {
  await request(app)
    .post('/users/login')
    .send({ email: 'habib@gmail.com', password: 'pass!12345' })
    .expect(200);
});

test('sign in using authentication', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(200);
});

test('Delete account', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('Upload profile picture', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/test-pic.jpeg')
    .expect(200);
  const user = await User.findById(userOneId);

  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('update a valid field', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Imad' })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.name).toBe('Imad');
  expect(user).toMatchObject({ name: 'Imad' });
});
