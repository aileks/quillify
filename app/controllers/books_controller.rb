class BooksController < ApplicationController
  def index
    @books = Current.user.books
  end
end
