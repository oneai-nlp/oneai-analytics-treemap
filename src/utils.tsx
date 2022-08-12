export function randomString(length: number) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString: string = '';

  for (let i = 0; i < length; i++) {
    let randomPoz = Math.floor(Math.random() * characters.length);
    randomString += characters.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
}
