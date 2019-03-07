import del from 'del';

del.sync('public/chunk-*');
export default [{
  input: ['src/client.js', 'src/update-controller.js'],
  output: {
    dir: 'public',
    format: 'es'
  }
}]
