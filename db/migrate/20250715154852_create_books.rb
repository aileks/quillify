class CreateBooks < ActiveRecord::Migration[8.0]
  def change
    create_table :books, id: :uuid do |t|
      t.string :title, null: false
      t.string :author, null: false
      t.integer :publication_year
      t.integer :pages
      t.string :genre, null: false
      t.boolean :read, null: false, default: false
      t.references :user, null: false, foreign_key: true, type: :uuid

      t.timestamps
    end
  end
end
