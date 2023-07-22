class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.model = query.model;
    this.queryString = queryString;
    this.numFilter = {};
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'order'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Extend query filter to allow for gt, gte, lt, lte
    //{ difficulty: 'easy', duration: { gt: '5' } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query.find(JSON.parse(queryStr));
    this.numFilter = JSON.parse(queryStr);
    return this;
  }

  sort() {
    if (!this.queryString.sort && this.query.model.modelName === 'Tour') {
      this.queryString.sort = '-price';
    } else if (!this.queryString.sort) {
      return this;
    }
    const sortBy = this.queryString.sort.split(',').join(' ');
    this.query = this.query.sort(sortBy);
    return this;
  }

  limitFields() {
    // Limit query to specific fields
    // query from req: fields: 'name,duration,difficulty,price', => select: 'name duration difficulty price'
    if (this.queryString.fields) {
      const selectFields = this.queryString.fields.split(',').join(' ');
      //console.log('selfields', selectFields);
      this.query = this.query.select(selectFields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  async countDocuments() {
    const num = await this.model.countDocuments(this.numFilter);
    return num;
  }

  // Pagination
  async paginate() {
    //const docNum = await Model.count9Documents(features.numFilter);
    const page = this.queryString.page ? this.queryString.page * 1 : 1;
    const limit = this.queryString.limit ? this.queryString.limit * 1 : 100;
    const skip = (page - 1) * limit;
    const num = await this.model.countDocuments(this.numFilter);

    //console.log('num', num);
    if (skip >= num) {
      throw new Error('This page does not exist');
    } else {
      this.query.skip(skip).limit(limit); //skip: 1, limit: 10
      return this;
    }
  }
}
module.exports = APIFeatures;
