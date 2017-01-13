module.exports = {
  replace_all: function (content, search_str, replace_str) {
    return content.split(search_str).join(replace_str);
  }
}
