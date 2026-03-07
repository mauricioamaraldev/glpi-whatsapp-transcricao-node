import ffmpeg from 'fluent-ffmpeg';

// Função para converter arquivos de áudio de .ogg para .mp3 usando ffmpeg
const converterOggToMp3 = function (caminhoOrigem, caminhoDestino) {
  return new Promise((resolve, reject) => {
    ffmpeg(caminhoOrigem)
      .toFormat('mp3')
      .on('error', (err) => {
        console.error('Erro ao converter o arquivo:', err);
        reject(err);
      })
      .on('end', () => {
        console.log('Conversão concluída com sucesso!');
        resolve();
      })
      .save(caminhoDestino);
  });
};

export {
  converterOggToMp3
}