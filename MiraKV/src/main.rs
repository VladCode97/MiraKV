use crate::domain::binary_codec::object_codecs::array_codec_serializer::ArrayCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::boolean_codec_serializer::BooleanCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::date_codec_serializer::DateCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::number_codec_serializer::NumberCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::string_codec_serializer::StringCodecSerializer;
use crate::domain::traits::serializer::Serializer;
use crate::domain::types::parser::{PrimitiveValues, Value};
use chrono::Utc;

mod domain;

fn main() {
    let number_codec = NumberCodecSerializer;
    let string_codec = StringCodecSerializer;
    let boolean_codec = BooleanCodecSerializer;
    let date_codec = DateCodecSerializer;
    let array_codec = ArrayCodecSerializer;
    let result = number_codec.serialize(&Value::Number(3.0));
    println!("Serializer number codec {:?}", result);
    println!(
        "Des-serializer number codec {:?}",
        number_codec.deserialize(&result)
    );
    println!("------");
    let result_string = string_codec.serialize(&Value::String("hello world".to_string()));
    println!("Serializer string codec {:?}", result_string);
    println!(
        "Des-serializer string codec {:?}",
        string_codec.deserialize(&result_string)
    );
    println!("------");
    let result_boolean = boolean_codec.serialize(&Value::Boolean(true));
    println!("Serializer boolean codec {:?}", result_boolean);
    println!(
        "Des-serializer boolean codec {:?}",
        boolean_codec.deserialize(&result_boolean)
    );
    println!("------");
    let result_date = date_codec.serialize(&Value::Date(Utc::now()));
    println!("Serializer date codec {:?}", result_date);
    println!(
        "Des-serializer date codec {:?}",
        date_codec.deserialize(&result_date)
    );
    let result_array = array_codec.serialize(&Value::Array(PrimitiveValues::Number(vec![
        1.0, 2.0, 3.0, 4.0,
    ])));
    println!("Serializer array codec {:?}", result_array);
    println!(
        "Des-serializer array codec {:?}",
        array_codec.deserialize(&result_array)
    )
}
