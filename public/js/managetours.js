export const sorttours = (sortBy, orderBy, limit, page) => {
  let queryString = '';

  if (page == undefined) page = 1;
  if (!limit) {
    queryString = `/managetours?sort=${sortBy}&order=${orderBy}&page=${page}`;
  } else {
    queryString = `/managetours?sort=${sortBy}&order=${orderBy}&limit=${limit}&page=${page}`;
  }

  window.setTimeout(() => {
    location.assign(queryString);
  });
};
