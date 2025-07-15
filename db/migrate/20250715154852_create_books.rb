class CreateBooks < ActiveRecord::Migration[8.0]
  def change
    create_table :books, id: :uuid do |t|
      t.string :title
      t.string :author
      t.integer :publication_year
      t.integer :pages
      t.string :genre
      t.boolean :read
      t.references :user, null: false, foreign_key: true, type: :uuid

      t.timestamps
    end
  end
end
