module.exports = function (Container) {
  var rootPath = "./server/storage/";
  Container.afterRemote('upload', function (context, remoteMethodOutput, next) {
    var file_upload = remoteMethodOutput.result.files.file[0];
    var uri = rootPath + file_upload.container + "/" + file_upload.name;
    Container.app.models.Image.upToS3(uri, function (err, data) {
      file_upload.url = data.url;
      file_upload.urlThumb = data.urlThumb;
      next();
    });
  });
};
