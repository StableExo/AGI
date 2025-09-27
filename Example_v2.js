function findUser(users, name) {
  return users.find(user => user.name === name);
}